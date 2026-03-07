package com.example.Ece.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.zip.GZIPInputStream;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/weather")
public class WeatherController {

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String API_KEY = "313adae9c53f44f7b8f08c66b69f8f79";

    @GetMapping("/now")
    public ResponseEntity<String> getWeatherNow(@RequestParam(defaultValue = "101240101") String location) {
        String url = String.format("https://mq2k5p6nrg.re.qweatherapi.com/v7/weather/now?location=%s", location);
        
        try {
            System.out.println("请求和风天气API: " + url);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-QW-Api-Key", API_KEY);
            headers.set("Accept-Encoding", "gzip");
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, entity, byte[].class);
            
            byte[] compressedData = response.getBody();
            if (compressedData == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("{\"code\":\"500\",\"message\":\"响应数据为空\"}");
            }
            
            String result;
            try (GZIPInputStream gzipInputStream = new GZIPInputStream(new ByteArrayInputStream(compressedData))) {
                result = new String(gzipInputStream.readAllBytes(), StandardCharsets.UTF_8);
            }
            
            System.out.println("响应内容: " + result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.out.println("请求失败: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"code\":\"500\",\"message\":\"获取天气数据失败: " + e.getMessage().replace("\"", "'") + "\"}");
        }
    }
}
