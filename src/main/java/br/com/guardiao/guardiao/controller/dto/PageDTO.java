package br.com.guardiao.guardiao.controller.dto;

import org.springframework.data.domain.Page;
import java.util.List;

public class PageDTO<T> {

    private final List<T> content;
    private final int currentPage;
    private final int totalPages;
    private final long totalItems;
    private final boolean isFirst;
    private final boolean isLast;

    public PageDTO(Page<T> page) {
        this.content = page.getContent();
        this.currentPage = page.getNumber();
        this.totalPages = page.getTotalPages();
        this.totalItems = page.getTotalElements();
        this.isFirst = page.isFirst();
        this.isLast = page.isLast();
    }

    // Getters
    public List<T> getContent() {
        return content;
    }

    public int getCurrentPage() {
        return currentPage;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public long getTotalItems() {
        return totalItems;
    }

    public boolean isFirst() {
        return isFirst;
    }

    public boolean isLast() {
        return isLast;
    }
}
