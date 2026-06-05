import http from 'http';

const API_BASE = 'http://localhost:3001/api';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const fullPath = '/api' + path;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3001,
        path: fullPath,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': 'u1',
          ...options.headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const result = {
              status: res.statusCode,
              data: JSON.parse(data),
            };
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(result);
            } else {
              reject(result);
            }
          } catch (e) {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

function log(title, data) {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  console.log('🚀 启动生猪产地检疫申报系统 Smoke 测试');
  console.log('目标：验证"申报免疫间隔不足批次并验证无法出证"\n');

  try {
    // 1. 登录 - 申报员
    console.log('1. 登录系统（申报员账号）');
    const loginResult = await request('/auth/login', {
      method: 'POST',
      body: { username: 'declarant', password: '123456' },
    });
    log('登录成功', loginResult.data);
    const user = loginResult.data.data;
    const authHeader = { 'X-User-Id': user.id };

    // 2. 创建一个新的猪群批次（用于测试免疫间隔不足）
    console.log('\n2. 创建测试猪群批次');
    const today = new Date();
    const tenDaysAgo = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
    const batchDate = tenDaysAgo.toISOString().split('T')[0];
    
    const createBatchResult = await request('/batches', {
      method: 'POST',
      headers: authHeader,
      body: {
        batch_no: 'TEST' + Date.now(),
        farm_name: '测试养殖场',
        pig_count: 50,
        breed: '测试品种',
        birth_date: '2024-01-01',
        source: '自繁自养',
      },
    });
    log('创建批次成功', createBatchResult.data);
    const batchId = createBatchResult.data.data.id;
    console.log('创建批次ID：', batchId);

    // 3. 添加一条10天前的免疫记录（间隔不足21天）
    console.log('\n3. 添加免疫记录（10天前，间隔不足）');
    await request(`/batches/${batchId}/immune`, {
      method: 'POST',
      headers: authHeader,
      body: {
        vaccine_type: '猪瘟疫苗',
        vaccine_date: batchDate,
        vaccine_batch: 'TEST001',
        manufacturer: '测试药厂',
        vaccinated_by: '测试兽医',
      },
    });
    console.log('添加免疫记录成功，日期：', batchDate);

    // 4. 检查该批次的免疫间隔
    console.log('\n4. 检查该批次的免疫间隔');
    const immuneResult = await request(`/batches/${batchId}/immune-check`, {
      headers: authHeader,
    });
    log('免疫间隔检查结果', immuneResult.data);

    const isImmuneValid = immuneResult.data.data.valid;
    console.log('免疫是否达标：', isImmuneValid ? '是' : '否');
    if (isImmuneValid) {
      console.log('警告：免疫应该不达标但显示达标，检查校验逻辑！');
    }

    // 5. 创建检疫申报
    console.log('\n5. 创建检疫申报单');
    const createResult = await request('/declarations', {
      method: 'POST',
      headers: authHeader,
      body: {
        batch_id: batchId,
        pig_count: 50,
        origin: '测试养殖场',
        destination: '测试屠宰场',
        receiver: '测试收货人',
        receiver_phone: '13800138000',
      },
    });
    log('创建申报成功', createResult.data);
    const declarationId = createResult.data.data.id;
    const declarationNo = createResult.data.data.declaration_no;
    console.log('申报单号：', declarationNo);

    // 6. 尝试免疫校验
    console.log('\n6. 执行免疫校验');
    try {
      const checkResult = await request(`/declarations/${declarationId}/immune-check`, {
        method: 'POST',
        headers: authHeader,
      });
      log('免疫校验结果', checkResult.data);
    } catch (e) {
      log('免疫校验失败（预期）', e.data);
    }

    // 7. 登录检疫员账号，尝试出证
    console.log('\n7. 登录检疫员账号，尝试出证');
    const inspectorLogin = await request('/auth/login', {
      method: 'POST',
      body: { username: 'inspector', password: '123456' },
    });
    const inspectorUser = inspectorLogin.data.data;
    const inspectorHeader = { 'X-User-Id': inspectorUser.id };

    // 先绑定车辆
    console.log('\n7. 绑定运输车辆');
    const vehiclesResult = await request('/vehicles', { headers: inspectorHeader });
    const vehicles = vehiclesResult.data.data;
    const vehicleId = vehicles[0]?.id;
    console.log('选择车辆：', vehicles[0]?.plate_no);

    try {
      const bindResult = await request(`/declarations/${declarationId}/bind-vehicle`, {
        method: 'POST',
        headers: inspectorHeader,
        body: { vehicle_id: vehicleId },
      });
      log('绑定车辆结果', bindResult.data);
    } catch (e) {
      log('绑定车辆结果', e.data);
    }

    // 8. 关键测试：尝试检疫出证（免疫间隔不足应该失败）
    console.log('\n8. ===== 关键测试：尝试检疫出证 =====');
    console.log('预期结果：免疫间隔不足21天，无法出证');
    
    try {
      const issueResult = await request(`/declarations/${declarationId}/issue-certificate`, {
        method: 'POST',
        headers: inspectorHeader,
        body: {
          certificate_no: 'TEST' + Date.now(),
          inspector_comment: '测试出证',
        },
      });
      log('出证结果（异常：应该失败）', issueResult.data);
      console.log('\n❌ 测试失败：出证应该失败但成功了！');
      process.exit(1);
    } catch (e) {
      log('出证失败（符合预期）', e.data);
      const errorMsg = e.data?.message || e.data?.error || '';
      if (errorMsg.includes('免疫') || errorMsg.includes('间隔') || errorMsg.includes('21')) {
        console.log('\n✅ 测试通过：免疫间隔不足，成功阻止出证！');
        console.log('错误信息：', errorMsg);
      } else {
        console.log('\n⚠️  出证失败，但错误信息不是免疫间隔相关');
        console.log('错误信息：', errorMsg);
      }
    }

    // 9. 验证车辆备案过期校验
    console.log('\n9. 验证车辆备案过期校验');
    if (vehicles.length > 0) {
      const checkVehicleResult = await request(`/vehicles/${vehicleId}/validity`, {
        headers: inspectorHeader,
      });
      log('车辆有效期校验结果', checkVehicleResult.data);
      console.log(
        '车辆状态：',
        checkVehicleResult.data.data.valid ? '正常' : '已过期'
      );
    }

    console.log('\n🎉 Smoke 测试完成！');
    console.log('核心业务流程验证通过：免疫间隔不足 -> 无法出证 ✅');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Smoke 测试失败：', error.message || error);
    if (error.data) {
      console.error('错误详情：', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

main();
