package com.cuyan;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.cuyan.mapper")
public class CuyanApplication {
    public static void main(String[] args) {
        SpringApplication.run(CuyanApplication.class, args);
    }
}
