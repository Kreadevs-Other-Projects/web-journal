CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_assignment_id UUID NOT NULL,
    decision review_decision NOT NULL DEFAULT 'pending',
    comment TEXT NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_reviews
        FOREIGN key (review_assignment_id)
        REFERENCES review_assignments(id)
        ON DELETE CASCADE
);