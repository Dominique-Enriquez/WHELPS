insert into public.pets (id, name, image, type, breed, age, gender, fixed_status, vaccination_status, description)
values
  ('max', 'Max', '/images/pets/max.webp', 'Dog', 'Golden Retriever', '2 years old', 'Male', 'Neutered', 'Vaccinated', 'A friendly and energetic retriever who loves to play fetch and is great with families and other dogs.'),
  ('luna', 'Luna', '/images/pets/luna.webp', 'Cat', 'Persian', '3 years old', 'Female', 'Spayed', 'Vaccinated', 'A beautiful and affectionate cat who loves cuddles, calm company, and quiet playtime.'),
  ('buddy', 'Buddy', '/images/pets/buddy.webp', 'Dog', 'Labrador', '5 months old', 'Male', 'Neutered', 'Vaccinated', 'A loyal, gentle family dog looking for an active home with plenty of love and play.'),
  ('felix', 'Felix', '/images/pets/felix.webp', 'Cat', 'Tabby', '2 years old', 'Male', 'Neutered', 'Vaccinated', 'An easygoing lap cat who enjoys head scratches and casual window-gazing.'),
  ('rocky', 'Rocky', '/images/pets/rocky.webp', 'Dog', 'Aspin', '4 years old', 'Male', 'Neutered', 'Vaccinated', 'An energetic, clever pup who would thrive in an active home with room to run.'),
  ('bella', 'Bella', '/images/pets/bella.webp', 'Cat', 'Puspin', '5 months old', 'Female', 'Spayed', 'Vaccinated', 'A confident, patient companion who gets along well with children and other pets.')
on conflict (id) do update set
  name = excluded.name, image = excluded.image, type = excluded.type, breed = excluded.breed, age = excluded.age,
  gender = excluded.gender, fixed_status = excluded.fixed_status, vaccination_status = excluded.vaccination_status,
  description = excluded.description, updated_at = now();
