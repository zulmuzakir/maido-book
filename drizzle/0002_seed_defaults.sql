INSERT INTO product (id, name, unit_label, servings_per_unit, price, active) VALUES ('prod_roove', 'ROOVE', 'sachet', 1, 0, 1);
--> statement-breakpoint
INSERT INTO setting (id, lead_days, retry_days, max_attempts, winback_days, updated_at) VALUES (1, 3, 2, 3, 30, cast(unixepoch('subsecond') * 1000 as integer));
--> statement-breakpoint
INSERT INTO message_template (kind, body, updated_at) VALUES
 ('reorder', 'Halo Kak {nama}, ini {cs}. Stok {produk} Kakak kira-kira tinggal beberapa hari lagi. Mau sekalian disiapkan order berikutnya supaya minumnya nggak terputus?', cast(unixepoch('subsecond') * 1000 as integer)),
 ('retry', 'Halo Kak {nama}, {cs} lagi ya. Kemarin sempat tanya soal {produk}. Kalau mau lanjut order, kabari saja ya Kak.', cast(unixepoch('subsecond') * 1000 as integer)),
 ('lead', 'Halo Kak {nama}, ini {cs}. Terima kasih sudah tertarik dengan {produk}. Ada yang bisa {cs} bantu jelaskan?', cast(unixepoch('subsecond') * 1000 as integer)),
 ('winback', 'Halo Kak {nama}, apa kabar? Sudah lama nggak minum {produk} ya. Kalau mau mulai lagi, {cs} siap bantu.', cast(unixepoch('subsecond') * 1000 as integer));
