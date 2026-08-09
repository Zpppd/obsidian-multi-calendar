import { HolidayUtil } from "lunar-typescript";

// 某天的节假日信息
export interface HolidayInfo {
    name: string;       // 节假日名，如 "春节"
    isWorkday: boolean; // true=调休上班日（"班"），false=法定假日（"休"）
    isHoliday: boolean; // 是否法定假日
}

// 节假日服务：基于 lunar-typescript 内置数据查询节假日和调休
export class HolidayService {
    // 查询某天是否为节假日/调休上班，返回 null 表示普通工作日
    // name 只在假期第一天返回（day === target），连续假期的其他天 name 为空
    getHoliday(year: number, month: number, day: number): HolidayInfo | null {
        const holiday = HolidayUtil.getHoliday(year, month, day);
        if (!holiday) return null;

        const isWorkday = holiday.isWork();
        // 只有假期第一天（target 指向自身）显示节日名，避免连续假期每天重复
        const isFirstDay = holiday.getDay() === holiday.getTarget();
        return {
            name: isFirstDay ? holiday.getName() : "",
            isWorkday: isWorkday,
            isHoliday: !isWorkday,
        };
    }

    // 调休上班的日期标记（"班"），用于格子右上角
    isWorkdayTransfer(year: number, month: number, day: number): boolean {
        const holiday = HolidayUtil.getHoliday(year, month, day);
        return holiday !== null && holiday.isWork();
    }

    // 法定假日的日期标记（"休"），用于格子右上角
    isLegalHoliday(year: number, month: number, day: number): boolean {
        const holiday = HolidayUtil.getHoliday(year, month, day);
        return holiday !== null && !holiday.isWork();
    }
}
