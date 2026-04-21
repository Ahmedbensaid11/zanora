package com.pi.zanoraback.model;

public enum NotificationType {

    // Sent to the property owner
    OFFER_RECEIVED,       // a buyer submitted an offer on your property
    REVIEW_RECEIVED,      // someone left a review on your property

    // Sent to the buyer
    OFFER_ACCEPTED,       // your offer was accepted
    OFFER_DECLINED        // your offer was declined (including auto-decline)
}