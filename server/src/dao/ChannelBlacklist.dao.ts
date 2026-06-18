import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op } from 'sequelize';
import ChannelBlacklist, { ChannelBlacklistAttributes, ChannelBlacklistCreationAttributes } from '../models/ChannelBlacklist.model';
import { ChannelBlacklistType } from '../constants/enum';

interface BlacklistCheckParams {
  companyName?: string;
  creditCode?: string;
  contactPhone?: string;
  legalPerson?: string;
}

interface BlacklistCheckResult {
  matched: boolean;
  items: ChannelBlacklist[];
}

class ChannelBlacklistDao {
  public async create(data: ChannelBlacklistCreationAttributes, options?: CreateOptions): Promise<ChannelBlacklist> {
    return ChannelBlacklist.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<ChannelBlacklist | null> {
    return ChannelBlacklist.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<ChannelBlacklist | null> {
    return ChannelBlacklist.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<ChannelBlacklist[]> {
    return ChannelBlacklist.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: ChannelBlacklist[]; count: number }> {
    return ChannelBlacklist.findAndCountAll(options);
  }

  public async update(data: Partial<ChannelBlacklistAttributes>, options: UpdateOptions): Promise<[number, ChannelBlacklist[]]> {
    return ChannelBlacklist.update(data, options) as unknown as Promise<[number, ChannelBlacklist[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return ChannelBlacklist.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return ChannelBlacklist.count(options);
  }

  public async checkMatch(params: BlacklistCheckParams): Promise<BlacklistCheckResult> {
    const { companyName, creditCode, contactPhone, legalPerson } = params;
    const orConditions: any[] = [];
    const now = new Date();

    if (companyName) {
      orConditions.push({ type: ChannelBlacklistType.COMPANY_NAME, value: companyName });
    }
    if (creditCode) {
      orConditions.push({ type: ChannelBlacklistType.CREDIT_CODE, value: creditCode });
    }
    if (contactPhone) {
      orConditions.push({ type: ChannelBlacklistType.CONTACT_PHONE, value: contactPhone });
    }
    if (legalPerson) {
      orConditions.push({ type: ChannelBlacklistType.LEGAL_PERSON, value: legalPerson });
    }

    if (orConditions.length === 0) {
      return { matched: false, items: [] };
    }

    const where: any = {
      [Op.and]: [
        { [Op.or]: orConditions },
        { isActive: true },
        {
          [Op.or]: [
            { expiredAt: null },
            { expiredAt: { [Op.gt]: now } },
          ],
        },
      ],
    };

    const items = await this.findAll({ where });
    return {
      matched: items.length > 0,
      items,
    };
  }
}

export default new ChannelBlacklistDao();
