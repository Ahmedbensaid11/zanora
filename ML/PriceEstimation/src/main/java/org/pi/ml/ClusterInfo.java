package org.pi.ml;

import lombok.Data;

@Data
public class ClusterInfo {
    private Integer clusterId;
    private Double averagePrice;
    private Integer count;
    private Double averageSize;
    private String dominantPropertyType;
    private String dominantCity;
}