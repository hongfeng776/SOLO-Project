package com.zhiqin.recruitment.common;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class LoginVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String token;

    private Long id;

    private String username;

    private String nickname;

    private String avatar;

    private List<String> roles;

}
