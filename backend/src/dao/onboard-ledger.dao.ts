import { BaseDao } from './base.dao';
import { OnboardLedger } from '../models';
import OnboardLedgerModel from '../models/onboard-ledger.model';
import { FindOptions, Op } from 'sequelize';

class OnboardLedgerDao extends BaseDao<OnboardLedgerModel> {
  constructor() {
    super(OnboardLedger);
  }

  async findByOnboardId(onboardId: number, options?: FindOptions): Promise<OnboardLedgerModel | null> {
    return this.findOne({
      where: { onboardId },
      ...options,
    });
  }

  async findByOnboardIds(onboardIds: number[], options?: FindOptions): Promise<OnboardLedgerModel[]> {
    return this.findAll({
      where: { onboardId: { [Op.in]: onboardIds } },
      ...options,
    });
  }

  async findByLedgerNo(ledgerNo: string, options?: FindOptions): Promise<OnboardLedgerModel | null> {
    return this.findOne({
      where: { ledgerNo },
      ...options,
    });
  }

  async findByEmployeeNo(employeeNo: string, options?: FindOptions): Promise<OnboardLedgerModel | null> {
    return this.findOne({
      where: { employeeNo },
      ...options,
    });
  }

  async findByDepartment(department: string, options?: FindOptions): Promise<OnboardLedgerModel[]> {
    return this.findAll({
      where: { department },
      order: [['onboardDate', 'DESC']],
      ...options,
    });
  }

  async findByOnboardDateRange(startDate: Date, endDate: Date, options?: FindOptions): Promise<OnboardLedgerModel[]> {
    return this.findAll({
      where: {
        onboardDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['onboardDate', 'DESC']],
      ...options,
    });
  }

  async generateLedgerNo(prefix: string = 'LZ'): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const datePart = `${year}${month}${day}`;

    const count = await this.count({
      where: {
        ledgerNo: {
          [Op.like]: `${prefix}${datePart}%`,
        },
      },
    });

    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}${datePart}${seq}`;
  }

  async generateEmployeeNo(prefix: string = 'EMP'): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const datePart = String(year).slice(-2);

    const count = await this.count({
      where: {
        employeeNo: {
          [Op.like]: `${prefix}${datePart}%`,
        },
      },
    });

    const seq = String(count + 1).padStart(5, '0');
    return `${prefix}${datePart}${seq}`;
  }

  async paginateWithRelations(params: any = {}, options: FindOptions = {}): Promise<any> {
    return this.paginate(params, {
      include: ['onboard'],
      order: [['onboardDate', 'DESC']],
      ...options,
    });
  }

  async findWithOnboard(options?: FindOptions): Promise<OnboardLedgerModel[]> {
    return this.findAll({
      include: ['onboard'],
      ...options,
    });
  }
}

export default new OnboardLedgerDao();
