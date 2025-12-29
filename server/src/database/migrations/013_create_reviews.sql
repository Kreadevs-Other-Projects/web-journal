CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_assigment_id UUID NOT NULL,
    decision NOT NULL
    comment TEXT NOT NULL,
    submitted_at TIMESTAMP NOT DEFAULT NOW(),

    CONSTRAINT fk_reviews
        FOREIGN key (review_assigment_id)
        REFERENCES review_assigments(id)
        ON DELETE CASCADE
);