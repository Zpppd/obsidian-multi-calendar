import { Solar } from "lunar-typescript";

// 某天的农历展示信息
export interface LunarInfo {
    dayText: string;        // 农历日，如 "初一"、"十五"、"廿三"
    monthText: string;      // 农历月，如 "正月"、"二月"（仅初一显示，否则空）
    festival: string;       // 农历节日，如 "春节"（无则为空）
    jieqi: string;          // 节气，如 "立春"（无则为空）
    shengxiao: string;      // 生肖，如 "龙"
}

// 农历查询工具：基于 lunar-typescript 计算某公历日期的农历信息
export function getLunarInfo(year: number, month: number, day: number): LunarInfo {
    const lunar = Solar.fromYmd(year, month, day).getLunar();

    const dayText = lunar.getDayInChinese();
    // 仅初一显示月份名（如 "正月"），其他日子不重复月份
    const monthText = day === 1 ? lunar.getMonthInChinese() : "";

    // 农历节日：优先取第一个
    const festivals = lunar.getFestivals();
    const festival = festivals.length > 0 ? festivals[0] : "";

    return {
        dayText,
        monthText,
        festival,
        jieqi: lunar.getJieQi(),
        shengxiao: lunar.getYearShengXiao(),
    };
}
