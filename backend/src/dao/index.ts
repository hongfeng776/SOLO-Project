import { BaseDao, PageResult, PageOptions } from './BaseDao';
import { AdminDao } from './AdminDao';
import { UserDao } from './UserDao';
import { GoodsDao } from './GoodsDao';
import { OrderDao } from './OrderDao';
import { MarketingDao } from './MarketingDao';
import { AfterSaleDao } from './AfterSaleDao';
import { MerchantDao } from './MerchantDao';

export {
  BaseDao,
  PageResult,
  PageOptions,
  AdminDao,
  UserDao,
  GoodsDao,
  OrderDao,
  MarketingDao,
  AfterSaleDao,
  MerchantDao,
};

export const daos = {
  adminDao: new AdminDao(),
  userDao: new UserDao(),
  goodsDao: new GoodsDao(),
  orderDao: new OrderDao(),
  marketingDao: new MarketingDao(),
  afterSaleDao: new AfterSaleDao(),
  merchantDao: new MerchantDao(),
};

export default daos;
