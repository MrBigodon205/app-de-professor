DO $$
DECLARE
  v_class_id BIGINT;
  v_student_id BIGINT;
BEGIN
  -- Class: 6º Ano
  INSERT INTO classes (name, sections, user_id) VALUES ('6º Ano', '{"A","B","C","D"}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_class_id;
  -- Student: Laura Monteiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Laura Monteiro', '01', 'LM', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{"3":{"talentShow":0,"exam":0}}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  INSERT INTO occurrences (student_id, type, description, date, user_id) VALUES (v_student_id, 'Indisciplina', 'gdsGdsgsDGDS', '2025-12-21', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858');
  -- Student: Larissa Campos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Larissa Campos', '02', 'LC', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Bernardo Nascimento
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Bernardo Nascimento', '03', 'BN', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Ana Nascimento
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Ana Nascimento', '04', 'AN', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Karina Oliveira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Karina Oliveira', '05', 'KO', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Mariana Silva
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Mariana Silva', '06', 'MS', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Carlos Cardoso
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Carlos Cardoso', '07', 'CC', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Yuri Monteiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Yuri Monteiro', '08', 'YM', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Felipe Pereira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Felipe Pereira', '09', 'FP', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Kaique Mendes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Kaique Mendes', '10', 'KM', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Olavo Freitas
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Olavo Freitas', '11', 'OF', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sabrina Barbosa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sabrina Barbosa', '12', 'SB', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Vitoria Almeida
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Vitoria Almeida', '13', 'VA', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Alice Pinto
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Alice Pinto', '14', 'AP', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Pedro Fernandes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Pedro Fernandes', '15', 'PF', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Caio Fernandes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Caio Fernandes', '16', 'CF', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Diana Carvalho
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Diana Carvalho', '17', 'DC', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Igor Alves
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Igor Alves', '18', 'IA', 'from-pink-400 to-rose-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Rodrigo Fernandes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Rodrigo Fernandes', '19', 'RF', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Fernanda Carvalho
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Fernanda Carvalho', '20', 'FC', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Olavo Rodrigues
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Olavo Rodrigues', '21', 'OR', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Lucas Gomes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Lucas Gomes', '22', 'LG', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Joao Campos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Joao Campos', '23', 'JC', 'from-pink-400 to-rose-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Karina Carvalho
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Karina Carvalho', '24', 'KC', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Tiago Pinto
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Tiago Pinto', '25', 'TP', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Nicole Pereira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Nicole Pereira', '26', 'NP', 'from-pink-400 to-rose-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Vitoria Mendes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Vitoria Mendes', '27', 'VM', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Daniela Ribeiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Daniela Ribeiro', '28', 'DR', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Eduardo Santos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Eduardo Santos', '29', 'ES', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Gabriel Rodrigues
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Gabriel Rodrigues', '30', 'GR', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Renan Cavalcanti
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Renan Cavalcanti', '01', 'RC', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Igor Castro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Igor Castro', '02', 'IC', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Beatriz Costa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Beatriz Costa', '03', 'BC', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Natalia Campos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Natalia Campos', '04', 'NC', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Natalia Freitas
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Natalia Freitas', '05', 'NF', 'from-pink-400 to-rose-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Enzo Lima
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Enzo Lima', '06', 'EL', 'from-green-400 to-emerald-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sabrina Rocha
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sabrina Rocha', '07', 'SR', 'from-purple-400 to-violet-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Natalia Almeida
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Natalia Almeida', '08', 'NA', 'from-red-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Eduardo Mendes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Eduardo Mendes', '09', 'EM', 'from-pink-400 to-rose-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Mariana Dias
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Mariana Dias', '10', 'MD', 'from-green-400 to-emerald-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Rafael Rodrigues
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Rafael Rodrigues', '11', 'RR', 'from-green-400 to-emerald-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Rodrigo Martins
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Rodrigo Martins', '12', 'RM', 'from-purple-400 to-violet-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Bernardo Santos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Bernardo Santos', '13', 'BS', 'from-green-400 to-emerald-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Julia Martins
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Julia Martins', '14', 'JM', 'from-pink-400 to-rose-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sofia Gomes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sofia Gomes', '15', 'SG', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Guilherme Campos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Guilherme Campos', '16', 'GC', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Eduardo Barros
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Eduardo Barros', '17', 'EB', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sabrina Alves
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sabrina Alves', '18', 'SA', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Valentina Rocha
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Valentina Rocha', '19', 'VR', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Karina Barbosa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Karina Barbosa', '20', 'KB', 'from-pink-400 to-rose-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Clara Fernandes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Clara Fernandes', '21', 'CF', 'from-purple-400 to-violet-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Enzo Campos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Enzo Campos', '22', 'EC', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Carlos Rodrigues
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Carlos Rodrigues', '23', 'CR', 'from-purple-400 to-violet-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Valentina Souza
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Valentina Souza', '24', 'VS', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Fernanda Cavalcanti
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Fernanda Cavalcanti', '25', 'FC', 'from-green-400 to-emerald-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Paula Martins
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Paula Martins', '26', 'PM', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Natalia Martins
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Natalia Martins', '27', 'NM', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Bernardo Silva
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Bernardo Silva', '28', 'BS', 'from-purple-400 to-violet-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Renan Lima
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Renan Lima', '29', 'RL', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Joao Martins
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Joao Martins', '30', 'JM', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Kaique Nascimento
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Kaique Nascimento', '01', 'KN', 'from-purple-400 to-violet-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sofia Oliveira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sofia Oliveira', '02', 'SO', 'from-red-400 to-orange-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Valentina Martins
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Valentina Martins', '03', 'VM', 'from-pink-400 to-rose-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Olavo Nascimento
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Olavo Nascimento', '04', 'ON', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Igor Cardoso
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Igor Cardoso', '05', 'IC', 'from-green-400 to-emerald-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Carlos Costa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Carlos Costa', '06', 'CC', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Thiago Alves
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Thiago Alves', '07', 'TA', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Carlos Alves
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Carlos Alves', '08', 'CA', 'from-pink-400 to-rose-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Arthur Costa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Arthur Costa', '09', 'AC', 'from-purple-400 to-violet-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Vitoria Oliveira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Vitoria Oliveira', '10', 'VO', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Davi Pinto
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Davi Pinto', '11', 'DP', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Tiago Monteiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Tiago Monteiro', '12', 'TM', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Miguel Cavalcanti
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Miguel Cavalcanti', '13', 'MC', 'from-red-400 to-orange-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Jorge Cardoso
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Jorge Cardoso', '14', 'JC', 'from-purple-400 to-violet-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Caio Monteiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Caio Monteiro', '15', 'CM', 'from-pink-400 to-rose-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Larissa Alves
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Larissa Alves', '16', 'LA', 'from-red-400 to-orange-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Elisa Santos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Elisa Santos', '17', 'ES', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sabrina Costa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sabrina Costa', '18', 'SC', 'from-green-400 to-emerald-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Bruno Gomes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Bruno Gomes', '19', 'BG', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Mariana Ribeiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Mariana Ribeiro', '20', 'MR', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Eduardo Rodrigues
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Eduardo Rodrigues', '21', 'ER', 'from-green-400 to-emerald-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Bernardo Mendes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Bernardo Mendes', '22', 'BM', 'from-red-400 to-orange-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Carlos Cardoso
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Carlos Cardoso', '23', 'CC', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Tiago Cavalcanti
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Tiago Cavalcanti', '24', 'TC', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Eduardo Castro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Eduardo Castro', '25', 'EC', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Arthur Campos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Arthur Campos', '26', 'AC', 'from-pink-400 to-rose-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Alice Silva
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Alice Silva', '27', 'AS', 'from-purple-400 to-violet-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Eduardo Santos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Eduardo Santos', '28', 'ES', 'from-pink-400 to-rose-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Mariana Almeida
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Mariana Almeida', '29', 'MA', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Daniela Castro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Daniela Castro', '30', 'DC', 'from-pink-400 to-rose-500', NULL, v_class_id, 'C', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Elisa Silva
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Elisa Silva', '01', 'ES', 'from-green-400 to-emerald-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Renan Mendes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Renan Mendes', '02', 'RM', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Olavo Martins
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Olavo Martins', '03', 'OM', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Gabriel Cardoso
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Gabriel Cardoso', '04', 'GC', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Elisa Pinto
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Elisa Pinto', '05', 'EP', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Tiago Silva
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Tiago Silva', '06', 'TS', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Otavio Cardoso
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Otavio Cardoso', '07', 'OC', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Carlos Castro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Carlos Castro', '08', 'CC', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Felipe Dias
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Felipe Dias', '09', 'FD', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Julia Barbosa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Julia Barbosa', '10', 'JB', 'from-red-400 to-orange-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Mariana Santos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Mariana Santos', '11', 'MS', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Julia Gomes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Julia Gomes', '12', 'JG', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sarah Barbosa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sarah Barbosa', '13', 'SB', 'from-green-400 to-emerald-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sofia Barros
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sofia Barros', '14', 'SB', 'from-green-400 to-emerald-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Larissa Martins
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Larissa Martins', '15', 'LM', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Nicole Fernandes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Nicole Fernandes', '16', 'NF', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Thiago Pereira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Thiago Pereira', '17', 'TP', 'from-green-400 to-emerald-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Olavo Fernandes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Olavo Fernandes', '18', 'OF', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sarah Alves
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sarah Alves', '19', 'SA', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Igor Silva
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Igor Silva', '20', 'IS', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Pietra Cardoso
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Pietra Cardoso', '21', 'PC', 'from-green-400 to-emerald-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Gabriel Castro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Gabriel Castro', '22', 'GC', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Tiago Rocha
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Tiago Rocha', '23', 'TR', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Jorge Costa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Jorge Costa', '24', 'JC', 'from-purple-400 to-violet-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Vanessa Monteiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Vanessa Monteiro', '25', 'VM', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Laura Barbosa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Laura Barbosa', '26', 'LB', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Pietra Monteiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Pietra Monteiro', '27', 'PM', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Rodrigo Dias
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Rodrigo Dias', '28', 'RD', 'from-purple-400 to-violet-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sarah Barbosa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sarah Barbosa', '29', 'SB', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sarah Fernandes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sarah Fernandes', '30', 'SF', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'D', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
END $$;