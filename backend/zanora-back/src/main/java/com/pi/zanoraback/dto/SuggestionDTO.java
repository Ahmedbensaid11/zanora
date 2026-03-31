package com.pi.zanoraback.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuggestionDTO {
    private Long id;
    private String name;
    private String parentName; // e.g. state name when this is a city suggestion
}