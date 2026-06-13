package com.cuyan.dto;

import lombok.Data;

@Data
public class UserUpdateDTO {

    private Long id;

    private String nickname;

    private String phone;

    private String email;

    private Integer status;
}
