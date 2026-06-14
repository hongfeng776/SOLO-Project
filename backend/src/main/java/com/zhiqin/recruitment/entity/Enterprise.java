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
@TableName("enterprise")
public class Enterprise implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("name")
    private String name;

    @TableField("contact_name")
    private String contactName;

    @TableField("contact_phone")
    private String contactPhone;

    @TableField("email")
    private String email;

    @TableField("address")
    private String address;

    @TableField("industry")
    private String industry;

    @TableField("scale")
    private String scale;

    @TableField("license_no")
    private String licenseNo;

    @TableField("status")
    private Integer status;

    @TableField("create_time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    @TableField("update_time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;

}
