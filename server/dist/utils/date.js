"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
class DateUtils {
    static now(format = this.DEFAULT_FORMAT) {
        return (0, dayjs_1.default)().tz(this.TIMEZONE).format(format);
    }
    static nowDate() {
        return (0, dayjs_1.default)().tz(this.TIMEZONE).format('YYYY-MM-DD');
    }
    static nowTimestamp() {
        return (0, dayjs_1.default)().valueOf();
    }
    static format(date, format = this.DEFAULT_FORMAT) {
        return (0, dayjs_1.default)(date).tz(this.TIMEZONE).format(format);
    }
    static parse(dateStr, format) {
        return (0, dayjs_1.default)(dateStr, format).toDate();
    }
    static addDays(date, days, format) {
        const result = (0, dayjs_1.default)(date).add(days, 'day');
        return format ? result.format(format) : result.format(this.DEFAULT_FORMAT);
    }
    static diffDays(date1, date2) {
        return (0, dayjs_1.default)(date1).diff((0, dayjs_1.default)(date2), 'day');
    }
    static isBefore(date1, date2) {
        return (0, dayjs_1.default)(date1).isBefore((0, dayjs_1.default)(date2));
    }
    static isAfter(date1, date2) {
        return (0, dayjs_1.default)(date1).isAfter((0, dayjs_1.default)(date2));
    }
    static startOfDay(date) {
        return (0, dayjs_1.default)(date).startOf('day').toDate();
    }
    static endOfDay(date) {
        return (0, dayjs_1.default)(date).endOf('day').toDate();
    }
}
DateUtils.DEFAULT_FORMAT = 'YYYY-MM-DD HH:mm:ss';
DateUtils.TIMEZONE = 'Asia/Shanghai';
exports.default = DateUtils;
//# sourceMappingURL=date.js.map