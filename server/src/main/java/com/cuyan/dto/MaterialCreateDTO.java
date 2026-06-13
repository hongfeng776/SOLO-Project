package com.cuyan.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MaterialCreateDTO {

    @NotNull(message = "词汇ID不能为空")
    private Long vocabularyId;

    @NotBlank(message = "标题不能为空")
    private String title;

    @NotBlank(message = "内容不能为空")
    private String content;

    @NotBlank(message = "素材类型不能为空")
    private String materialType;

    private String source;

    private Integer difficulty;

    private Integer status;
}
