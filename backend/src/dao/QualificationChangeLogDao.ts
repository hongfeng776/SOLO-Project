import { BaseDao } from './BaseDao';
import { QualificationChangeLog } from '../models/QualificationChangeLog';
import { Op, FindOptions } from 'sequelize';

export class QualificationChangeLogDao extends BaseDao<QualificationChangeLog> {
  constructor() {
    super(QualificationChangeLog);
  }

  async findByMerchantId(
    merchantId: number,
    options?: Omit<FindOptions<QualificationChangeLog>, 'where'>
  ): Promise<QualificationChangeLog[]> {
    return this.model.findAll({
      where: { merchant_id: merchantId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByQualificationId(
    qualificationId: number,
    options?: Omit<FindOptions<QualificationChangeLog>, 'where'>
  ): Promise<QualificationChangeLog[]> {
    return this.model.findAll({
      where: { qualification_id: qualificationId } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByChangeField(
    changeField: string,
    options?: Omit<FindOptions<QualificationChangeLog>, 'where'>
  ): Promise<QualificationChangeLog[]> {
    return this.model.findAll({
      where: { change_field: changeField } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  async findByDateRange(
    startTime: Date,
    endTime: Date,
    options?: Omit<FindOptions<QualificationChangeLog>, 'where'>
  ): Promise<QualificationChangeLog[]> {
    return this.model.findAll({
      where: {
        created_at: {
          [Op.between]: [startTime, endTime],
        },
      } as any,
      order: [['created_at', 'DESC']],
      ...options,
    });
  }
}

export default QualificationChangeLogDao;
