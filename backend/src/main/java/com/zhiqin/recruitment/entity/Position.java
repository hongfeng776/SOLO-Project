package com.zhiqin.recruitment.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("position")
public class Position implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("title")
    private String title;

    @TableField("enterprise_id")
    private Long enterpriseId;

    @TableField("enterprise_name")
    private String enterpriseName;

    @TableField("salary_min")
    private Integer salaryMin;

    @TableField("salary_max")
    private Integer salaryMax;

    @TableField("city")
    private String city;

    @TableField("education")
    private String education;

    @TableField("experience")
    private String experience;

    @TableField("description")
    private String description;

    @TableField("status")
    private Integer status;

    @TableField("create_time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    @TableField("update_time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;

}
