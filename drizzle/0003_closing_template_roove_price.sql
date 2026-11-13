INSERT OR IGNORE INTO message_template (kind, body, updated_at) VALUES ('closing', 'Halo Kak {nama}, ini {cs}. Kemarin Kakak sempat tertarik dengan {produk}. Mau {cs} bantu siapkan ordernya sekarang?', cast(unixepoch('subsecond') * 1000 as integer));
--> statement-breakpoint
UPDATE product SET price = 10100 WHERE id = 'prod_roove' AND price = 0;
