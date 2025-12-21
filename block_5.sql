DO $$
DECLARE
  v_class_id BIGINT;
  v_student_id BIGINT;
BEGIN
  -- Class: 2º Ano E.M.
  INSERT INTO classes (name, sections, user_id) VALUES ('2º Ano E.M.', '{"A"}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_class_id;
  -- Student: Gabriel Ribeiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Gabriel Ribeiro', '01', 'GR', 'from-pink-400 to-rose-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Vanessa Campos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Vanessa Campos', '02', 'VC', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Otavio Castro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Otavio Castro', '03', 'OC', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Valentina Souza
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Valentina Souza', '04', 'VS', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Larissa Barbosa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Larissa Barbosa', '05', 'LB', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Natalia Freitas
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Natalia Freitas', '06', 'NF', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Diana Rodrigues
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Diana Rodrigues', '07', 'DR', 'from-pink-400 to-rose-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Karina Silva
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Karina Silva', '08', 'KS', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Igor Souza
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Igor Souza', '09', 'IS', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Daniela Cavalcanti
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Daniela Cavalcanti', '10', 'DC', 'from-pink-400 to-rose-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Olavo Nascimento
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Olavo Nascimento', '11', 'ON', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Lucas Souza
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Lucas Souza', '12', 'LS', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Vitoria Cardoso
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Vitoria Cardoso', '13', 'VC', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Karina Santos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Karina Santos', '14', 'KS', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Davi Campos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Davi Campos', '15', 'DC', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Thiago Freitas
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Thiago Freitas', '16', 'TF', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Gabriel Fernandes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Gabriel Fernandes', '17', 'GF', 'from-pink-400 to-rose-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Valentina Castro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Valentina Castro', '18', 'VC', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Elisa Castro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Elisa Castro', '19', 'EC', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Beatriz Mendes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Beatriz Mendes', '20', 'BM', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Paula Santos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Paula Santos', '21', 'PS', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Olivia Costa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Olivia Costa', '22', 'OC', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Caio Araujo
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Caio Araujo', '23', 'CA', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Bernardo Mendes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Bernardo Mendes', '24', 'BM', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Felipe Almeida
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Felipe Almeida', '25', 'FA', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Heitor Santos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Heitor Santos', '26', 'HS', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Rafael Moura
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Rafael Moura', '27', 'RM', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Miguel Silva
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Miguel Silva', '28', 'MS', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Eduardo Lima
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Eduardo Lima', '29', 'EL', 'from-pink-400 to-rose-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Felipe Oliveira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Felipe Oliveira', '30', 'FO', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
END $$;