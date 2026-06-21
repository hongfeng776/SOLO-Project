import { BaseDao } from './base.dao';
import { RegularizationApprovalNodeRecord } from '../models';
import RegularizationApprovalNodeRecordModel from '../models/regularization-approval-node.model';
import { FindOptions, Transaction, Op, Sequelize } from 'sequelize';

class RegularizationApprovalNodeDao extends BaseDao<RegularizationApprovalNodeRecordModel> {
  constructor() {
    super(RegularizationApprovalNodeRecord);
  }

  async findByRegularizationId(
    regularizationId: number,
    options?: FindOptions
  ): Promise<RegularizationApprovalNodeRecordModel[]> {
    return this.findAll({
      where: { regularizationId },
      order: [['nodeIndex', 'ASC']],
      ...options,
    });
  }

  async findCurrentNode(
    regularizationId: number,
    currentIndex: number
  ): Promise<RegularizationApprovalNodeRecordModel | null> {
    return this.findOne({
      where: {
        regularizationId,
        nodeIndex: currentIndex,
      },
    });
  }

  async bulkCreateForRegularization(
    regularizationId: number,
    nodes: Array<{
      nodeKey: string;
      nodeName?: string;
      nodeIndex: number;
      nodeStatus?: string;
    }>,
    transaction?: Transaction
  ): Promise<RegularizationApprovalNodeRecordModel[]> {
    const data = nodes.map((node) => ({
      ...node,
      regularizationId,
    }));
    return this.bulkCreate(data, transaction ? { transaction } : undefined);
  }

  async deleteByRegularizationId(
    regularizationId: number,
    transaction?: Transaction
  ): Promise<number> {
    return this.destroy({
      where: { regularizationId },
      transaction,
    });
  }

  async updateNodeWithVersion(
    id: number,
    data: any,
    currentVersion: number,
    transaction?: Transaction
  ): Promise<[number, RegularizationApprovalNodeRecordModel[]]> {
    const updateData = { ...data, version: Sequelize.literal('version + 1') as any };
    return this.update(updateData, {
      where: { id, version: currentVersion },
      transaction,
    });
  }

  async getApprovedCount(regularizationId: number): Promise<number> {
    return this.count({
      where: {
        regularizationId,
        nodeStatus: 'approved',
      },
    });
  }

  async findPendingNodes(regularizationId: number): Promise<RegularizationApprovalNodeRecordModel[]> {
    return this.findAll({
      where: {
        regularizationId,
        nodeStatus: 'pending',
      },
      order: [['nodeIndex', 'ASC']],
    });
  }
}

export default new RegularizationApprovalNodeDao();
