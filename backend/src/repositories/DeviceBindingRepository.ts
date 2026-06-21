import { BaseRepository } from './BaseRepository';
import { DeviceBinding } from '../models';
import { Op } from 'sequelize';
import dayjs from 'dayjs';

export class DeviceBindingRepository extends BaseRepository<DeviceBinding> {
  constructor() {
    super(DeviceBinding);
  }

  async findByDeviceId(deviceId: string): Promise<DeviceBinding | null> {
    return await this.model.findOne({ where: { device_id: deviceId } });
  }

  async findByUserId(userId: string): Promise<DeviceBinding[]> {
    return await this.model.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });
  }

  async findByCustomerId(customerId: string): Promise<DeviceBinding[]> {
    return await this.model.findAll({
      where: { customer_id: customerId },
      order: [['created_at', 'DESC']]
    });
  }

  async isTrustedDevice(deviceId: string, accountNo: string): Promise<boolean> {
    const count = await this.model.count({
      where: {
        device_id: deviceId,
        account_no: accountNo,
        is_trusted: true,
        status: 1
      }
    });
    return count > 0;
  }

  async updateLastLogin(deviceId: string, ip: string): Promise<[number, DeviceBinding[]]> {
    return await this.model.update(
      {
        last_login_ip: ip,
        last_login_time: new Date()
      },
      {
        where: { device_id: deviceId },
        individualHooks: true
      }
    );
  }

  async bindDevice(deviceInfo: any, userId: string, accountNo: string): Promise<DeviceBinding> {
    const existing = await this.model.findOne({
      where: {
        device_id: deviceInfo.device_id,
        account_no: accountNo
      }
    });

    if (existing) {
      await this.model.update(
        {
          status: 1,
          user_id: userId,
          bind_time: new Date(),
          ...deviceInfo
        },
        {
          where: { id: existing.id },
          individualHooks: true
        }
      );
      return await this.findById(existing.id) as DeviceBinding;
    }

    return await this.create({
      ...deviceInfo,
      user_id: userId,
      account_no: accountNo,
      status: 1,
      bind_time: new Date()
    });
  }

  async unbindDevice(deviceId: string): Promise<number> {
    return await this.model.update(
      {
        status: 2,
        unbind_time: new Date()
      },
      {
        where: { device_id: deviceId },
        individualHooks: true
      }
    ).then((result: [number, DeviceBinding[]]) => result[0]);
  }
}
