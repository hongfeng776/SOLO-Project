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
@TableName("violation")
public class Violation implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("target_type")
    private Integer targetType;

    @TableField("target_id")
    private Long targetId;

    @TableField("target_name")
    private String targetName;

    @TableField("type")
    private Integer type;

    @TableField("description")
    private String description;

    @TableField("handle_status")
    private Integer handleStatus;

    @TableField("handle_result")
    private String handleResult;

    @TableField("create_time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    @TableField("update_time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;

}
