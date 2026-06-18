import { FindOptions, CreateOptions } from 'sequelize';
import PromoterLevelRule, { PromoterLevelRuleAttributes, PromoterLevelRuleCreationAttributes } from '../models/PromoterLevelRule.model';
import { PromoterLevel } from '../constants/enum';
declare class PromoterLevelRuleDao {
    create(data: PromoterLevelRuleCreationAttributes, options?: CreateOptions): Promise<PromoterLevelRule>;
    findByPk(id: string, options?: FindOptions): Promise<PromoterLevelRule | null>;
    findByLevel(level: PromoterLevel, options?: FindOptions): Promise<PromoterLevelRule | null>;
    findAllActive(atDate?: Date, options?: FindOptions): Promise<PromoterLevelRule[]>;
    findAll(options?: FindOptions): Promise<PromoterLevelRule[]>;
    update(id: string, data: Partial<PromoterLevelRuleAttributes>): Promise<[number, PromoterLevelRule[]]>;
    delete(id: string): Promise<number>;
}
declare const _default: PromoterLevelRuleDao;
export default _default;
//# sourceMappingURL=PromoterLevelRule.dao.d.ts.map