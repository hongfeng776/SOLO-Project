import { BaseDao } from './BaseDao';
import { LogisticsTrack } from '../models/LogisticsTrack';

export class LogisticsTrackDao extends BaseDao<LogisticsTrack> {
  constructor() {
    super(LogisticsTrack);
  }

  async getByShipmentId(shipmentId: number): Promise<LogisticsTrack[]> {
    return this.model.findAll({
      where: { shipment_id: shipmentId } as any,
      order: [['track_time', 'ASC']],
    });
  }
}

export default LogisticsTrackDao;
