package com.zhiqin.recruitment.common;

import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.annotation.write.style.ColumnWidth;
import com.alibaba.excel.annotation.write.style.ContentRowHeight;
import com.alibaba.excel.annotation.write.style.HeadRowHeight;
import lombok.Data;

import java.io.Serializable;

@Data
@HeadRowHeight(20)
@ContentRowHeight(18)
public class SeekerExcelVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @ExcelProperty("序号")
    @ColumnWidth(8)
    private Integer index;

    @ExcelProperty("姓名")
    @ColumnWidth(12)
    private String name;

    @ExcelProperty("性别")
    @ColumnWidth(8)
    private String gender;

    @ExcelProperty("年龄")
    @ColumnWidth(8)
    private Integer age;

    @ExcelProperty("联系电话")
    @ColumnWidth(15)
    private String phone;

    @ExcelProperty("邮箱")
    @ColumnWidth(25)
    private String email;

    @ExcelProperty("学历")
    @ColumnWidth(10)
    private String education;

    @ExcelProperty("工作年限")
    @ColumnWidth(12)
    private String workYears;

    @ExcelProperty("求职意向")
    @ColumnWidth(20)
    private String jobIntention;

    @ExcelProperty("期望薪资")
    @ColumnWidth(12)
    private String expectedSalary;

    @ExcelProperty("期望城市")
    @ColumnWidth(12)
    private String expectedCity;

    @ExcelProperty("账号状态")
    @ColumnWidth(10)
    private String status;

    @ExcelProperty("注册时间")
    @ColumnWidth(20)
    private String createTime;

}
