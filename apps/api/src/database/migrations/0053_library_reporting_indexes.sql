CREATE INDEX library_loans_returned_reporting ON library_loans(returned_at DESC) WHERE returned_at IS NOT NULL;
CREATE INDEX library_copies_status_reporting ON library_book_copies(status,book_id);
CREATE INDEX library_visits_exit_reporting ON library_visits(exit_at DESC) WHERE exit_at IS NOT NULL;
