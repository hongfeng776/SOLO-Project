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
@TableName("resume")
public class Resume implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("seeker_id")
    private Long seekerId;

    @TableField("seeker_name")
    private String seekerName;

    @TableField("position_id")
    private Long positionId;

    @TableField("position_title")
    private String positionTitle;

    @TableField("enterprise_name")
    private String enterpriseName;

    @TableField("status")
    private Integer status;

    @TableField("remark")
    private String remark;

    @TableField("create_time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    @TableField("update_time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;

}
