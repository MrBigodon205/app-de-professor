DO $$
DECLARE
  v_class_id BIGINT;
  v_student_id BIGINT;
BEGIN
  -- Class: 9º Ano
  INSERT INTO classes (name, sections, user_id) VALUES ('9º Ano', '{"A","B"}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_class_id;
  -- Student: Karina Ribeiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Karina Ribeiro', '01', 'KR', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Tiago Araujo
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Tiago Araujo', '02', 'TA', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Rodrigo Costa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Rodrigo Costa', '03', 'RC', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Tales Ribeiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Tales Ribeiro', '04', 'TR', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Renan Moura
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Renan Moura', '05', 'RM', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Laura Freitas
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Laura Freitas', '06', 'LF', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Carlos Lima
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Carlos Lima', '07', 'CL', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Laura Ribeiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Laura Ribeiro', '08', 'LR', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Felipe Dias
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Felipe Dias', '09', 'FD', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Alice Oliveira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Alice Oliveira', '10', 'AO', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sofia Pinto
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sofia Pinto', '11', 'SP', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Alice Pereira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Alice Pereira', '12', 'AP', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Pietra Almeida
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Pietra Almeida', '13', 'PA', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Vitoria Lima
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Vitoria Lima', '14', 'VL', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Tiago Barros
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Tiago Barros', '15', 'TB', 'from-pink-400 to-rose-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Olavo Ribeiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Olavo Ribeiro', '16', 'OR', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Rafael Monteiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Rafael Monteiro', '17', 'RM', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Jorge Oliveira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Jorge Oliveira', '18', 'JO', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Thiago Moura
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Thiago Moura', '19', 'TM', 'from-pink-400 to-rose-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Valentina Campos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Valentina Campos', '20', 'VC', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Clara Barros
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Clara Barros', '21', 'CB', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Jorge Lima
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Jorge Lima', '22', 'JL', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Arthur Barbosa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Arthur Barbosa', '23', 'AB', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Mariana Alves
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Mariana Alves', '24', 'MA', 'from-pink-400 to-rose-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Guilherme Barbosa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Guilherme Barbosa', '25', 'GB', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Fabiana Fernandes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Fabiana Fernandes', '26', 'FF', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Helena Fernandes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Helena Fernandes', '27', 'HF', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Fabiana Rocha
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Fabiana Rocha', '28', 'FR', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Kaique Dias
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Kaique Dias', '29', 'KD', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Kaique Costa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Kaique Costa', '30', 'KC', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Larissa Lima
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Larissa Lima', '01', 'LL', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Bernardo Nascimento
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Bernardo Nascimento', '02', 'BN', 'from-pink-400 to-rose-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sofia Freitas
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sofia Freitas', '03', 'SF', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sabrina Almeida
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sabrina Almeida', '04', 'SA', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sofia Araujo
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sofia Araujo', '05', 'SA', 'from-red-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Natalia Dias
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Natalia Dias', '06', 'ND', 'from-red-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Olivia Freitas
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Olivia Freitas', '07', 'OF', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Karina Almeida
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Karina Almeida', '08', 'KA', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Vitoria Ribeiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Vitoria Ribeiro', '09', 'VR', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Kaique Mendes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Kaique Mendes', '10', 'KM', 'from-purple-400 to-violet-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Igor Ribeiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Igor Ribeiro', '11', 'IR', 'from-green-400 to-emerald-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Paula Oliveira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Paula Oliveira', '12', 'PO', 'from-red-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Renan Rocha
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Renan Rocha', '13', 'RR', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Jorge Barros
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Jorge Barros', '14', 'JB', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Igor Almeida
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Igor Almeida', '15', 'IA', 'from-purple-400 to-violet-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sarah Araujo
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sarah Araujo', '16', 'SA', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Gabriel Lima
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Gabriel Lima', '17', 'GL', 'from-purple-400 to-violet-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Ana Pereira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Ana Pereira', '18', 'AP', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Beatriz Barros
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Beatriz Barros', '19', 'BB', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Valentina Souza
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Valentina Souza', '20', 'VS', 'from-pink-400 to-rose-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Enzo Oliveira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Enzo Oliveira', '21', 'EO', 'from-green-400 to-emerald-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Joao Alves
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Joao Alves', '22', 'JA', 'from-green-400 to-emerald-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Felipe Rodrigues
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Felipe Rodrigues', '23', 'FR', 'from-pink-400 to-rose-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Mateus Souza
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Mateus Souza', '24', 'MS', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sofia Cavalcanti
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sofia Cavalcanti', '25', 'SC', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Kaique Freitas
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Kaique Freitas', '26', 'KF', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Yuri Cavalcanti
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Yuri Cavalcanti', '27', 'YC', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Arthur Rodrigues
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Arthur Rodrigues', '28', 'AR', 'from-green-400 to-emerald-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Karina Dias
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Karina Dias', '29', 'KD', 'from-purple-400 to-violet-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Enzo Pereira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Enzo Pereira', '30', 'EP', 'from-red-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
END $$;