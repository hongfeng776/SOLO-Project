package com.zhiqin.recruitment;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.zhiqin.recruitment.mapper")
public class ZhiqinRecruitmentApplication {

    public static void main(String[] args) {
        SpringApplication.run(ZhiqinRecruitmentApplication.class, args);
    }

}
