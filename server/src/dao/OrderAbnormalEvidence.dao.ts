import { FindOptions, Op } from 'sequelize';
import OrderAbnormalEvidence, {
  OrderAbnormalEvidenceAttributes,
  OrderAbnormalEvidenceCreationAttributes,
} from '../models/OrderAbnormalEvidence.model';

class OrderAbnormalEvidenceDao {
  public async create(
    data: OrderAbnormalEvidenceCreationAttributes
  ): Promise<OrderAbnormalEvidence> {
    return OrderAbnormalEvidence.create(data);
  }

  public async bulkCreate(
    dataList: OrderAbnormalEvidenceCreationAttributes[]
  ): Promise<OrderAbnormalEvidence[]> {
    return OrderAbnormalEvidence.bulkCreate(dataList);
  }

  public async findById(id: string): Promise<OrderAbnormalEvidence | null> {
    return OrderAbnormalEvidence.findByPk(id);
  }

  public async findByAbnormalRecordId(
    abnormalRecordId: string
  ): Promise<OrderAbnormalEvidence[]> {
    return OrderAbnormalEvidence.findAll({
      where: { abnormalRecordId },
      order: [['createdAt', 'DESC']],
    });
  }

  public async findByOrderId(orderId: string): Promise<OrderAbnormalEvidence[]> {
    return OrderAbnormalEvidence.findAll({
      where: { orderId },
      order: [['createdAt', 'DESC']],
    });
  }

  public async findAndCountAll(
    options: FindOptions
  ): Promise<{ rows: OrderAbnormalEvidence[]; count: number }> {
    return OrderAbnormalEvidence.findAndCountAll(options);
  }

  public async delete(id: string): Promise<number> {
    return OrderAbnormalEvidence.destroy({ where: { id } });
  }

  public async deleteByAbnormalRecordId(abnormalRecordId: string): Promise<number> {
    return OrderAbnormalEvidence.destroy({ where: { abnormalRecordId } });
  }
}

export default new OrderAbnormalEvidenceDao();
