import { BaseRepository } from './BaseRepository';
import { DeviceBinding } from '../models';
import { WhereOptions, Op, Includeable } from 'sequelize';
import dayjs from 'dayjs';

export class DeviceBindingRepository extends BaseRepository<DeviceBinding> {
  constructor() {
    super(DeviceBinding);
  }

  async findByDeviceId(deviceId: string): Promise<DeviceBinding | null> {
    return await this.model.findOne({ where: { device_id: deviceId } });
  }

  async findByFingerprint(fingerprint: string): Promise<DeviceBinding | null> {
    return await this.model.findOne({ where: { device_fingerprint: fingerprint } });
  }

  async findByCustomerId(customerId: string): Promise<DeviceBinding[]> {
    return await this.model.findAll({
      where: { customer_id: customerId },
      order: [['last_login_time', 'DESC']]
    });
  }

  async findByAccountNo(accountNo: string): Promise<DeviceBinding[]> {
    return await this.model.findAll({
      where: { account_no: accountNo },
      order: [['last_login_time', 'DESC']]
    });
  }

  async findTrustedByCustomerId(
    customerId: string,
    minTrustLevel: number = 3
  ): Promise<DeviceBinding[]> {
    return await this.model.findAll({
      where: {
        customer_id: customerId,
        trust_level: { [Op.gte]: minTrustLevel },
        is_active: true
      },
      order: [['trust_level', 'DESC'], ['last_login_time', 'DESC']]
    });
  }

  async generateDeviceId(): Promise<string> {
    const prefix = 'DEV';
    const timestamp = Date.now().toString();
    let seq = Math.floor(Math.random() * 900 + 100).toString();
    let finalId = '';
    let attempts = 0;
    while (attempts < 100) {
      finalId = `${prefix}${timestamp}${seq}`;
      const exists = await this.model.count({ where: { device_id: finalId } });
      if (exists === 0) break;
      seq = Math.floor(Math.random() * 900 + 100).toString();
      attempts++;
    }
    return finalId;
  }

  async countLastHourLoginsByIp(ip: string, customerId?: string): Promise<number> {
    const oneHourAgo = dayjs().subtract(1, 'hour').toDate();
    const where: any = {
      last_login_ip: ip,
      last_login_time: {
        [Op.gte]: oneHourAgo
      }
    };
    if (customerId) {
      where.customer_id = customerId;
    }
    return await this.model.count({ where });
  }

  async getCustomerDeviceCount(customerId: string): Promise<number> {
    return await this.model.count({
      where: {
        customer_id: customerId,
        is_active: true
      }
    });
  }

  async findByCustomerIdAndDevice(customerId: string, deviceId?: string, fingerprint?: string): Promise<DeviceBinding | null> {
    const where: any = { customer_id: customerId };
    if (deviceId) {
      where.device_id = deviceId;
    } else if (fingerprint) {
      where.device_fingerprint = fingerprint;
    } else {
      return null;
    }
    return await this.model.findOne({ where });
  }

  async updateLastLogin(deviceId: string, ip: string, location?: string): Promise<void> {
    await this.model.update(
      {
        last_login_ip: ip,
        last_login_location: location,
        last_login_time: new Date()
      },
      { where: { device_id: deviceId } }
    );
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { device_id: { [Op.like]: `%${params.keyword}%` } },
        { device_fingerprint: { [Op.like]: `%${params.keyword}%` } },
        { device_model: { [Op.like]: `%${params.keyword}%` } },
        { last_login_ip: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.device_id) {
      where.device_id = { [Op.like]: `%${params.device_id}%` };
    }

    if (params.customer_id) {
      where.customer_id = params.customer_id;
    }

    if (params.account_no) {
      where.account_no = params.account_no;
    }

    if (params.trust_level !== undefined) {
      if (Array.isArray(params.trust_level)) {
        where.trust_level = { [Op.in]: params.trust_level };
      } else {
        where.trust_level = params.trust_level;
      }
    }

    if (params.min_trust_level !== undefined) {
      where.trust_level = { ...(where.trust_level || {}), [Op.gte]: params.min_trust_level };
    }

    if (params.risk_level !== undefined) {
      where.risk_level = params.risk_level;
    }

    if (params.is_active !== undefined) {
      where.is_active = params.is_active;
    }

    if (params.last_login_ip) {
      where.last_login_ip = params.last_login_ip;
    }

    if (params.os_type) {
      where.os_type = { [Op.like]: `%${params.os_type}%` };
    }

    if (params.start_time) {
      where.last_login_time = {
        ...(where.last_login_time || {}),
        [Op.gte]: dayjs(params.start_time).startOf('day').toDate()
      };
    }

    if (params.end_time) {
      where.last_login_time = {
        ...(where.last_login_time || {}),
        [Op.lte]: dayjs(params.end_time).endOf('day').toDate()
      };
    }

    return where;
  }

  buildInclude(): Includeable[] {
    return [
      {
        model: require('../models/Customer').Customer,
        required: false,
        attributes: ['id', 'customer_no', 'customer_name', 'mobile', 'risk_level']
      },
      {
        model: require('../models/Account').Account,
        required: false,
        attributes: ['id', 'account_no', 'account_type', 'status']
      }
    ];
  }
}
