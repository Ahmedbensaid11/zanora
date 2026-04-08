package org.pi.filter;
import jakarta.ws.rs.container.*;
import jakarta.ws.rs.ext.Provider;

@Provider
public class CorsFilter implements ContainerResponseFilter {

    @Override
    public void filter(ContainerRequestContext req, ContainerResponseContext res) {

        String origin = req.getHeaderString("Origin");

        if (origin != null && (origin.equals("http://localhost:8081") || origin.equals("http://localhost:5173"))) {
            res.getHeaders().putSingle("Access-Control-Allow-Origin", origin);
        }

        res.getHeaders().putSingle("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.getHeaders().putSingle("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");
    }
}