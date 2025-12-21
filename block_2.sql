DO $$
DECLARE
  v_class_id BIGINT;
  v_student_id BIGINT;
BEGIN
  -- Class: 8º Ano
  INSERT INTO classes (name, sections, user_id) VALUES ('8º Ano', '{"A","B"}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_class_id;
  -- Student: Guilherme Mendes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Guilherme Mendes', '01', 'GM', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Miguel Dias
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Miguel Dias', '02', 'MD', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Jorge Fernandes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Jorge Fernandes', '03', 'JF', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Tiago Dias
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Tiago Dias', '04', 'TD', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Isadora Barbosa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Isadora Barbosa', '05', 'IB', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Daniela Oliveira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Daniela Oliveira', '06', 'DO', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Kaique Silva
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Kaique Silva', '07', 'KS', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Rodrigo Pinto
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Rodrigo Pinto', '08', 'RP', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Tiago Lima
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Tiago Lima', '09', 'TL', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Tales Ribeiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Tales Ribeiro', '10', 'TR', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Rafael Santos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Rafael Santos', '11', 'RS', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Miguel Campos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Miguel Campos', '12', 'MC', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Miguel Cavalcanti
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Miguel Cavalcanti', '13', 'MC', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Karina Gomes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Karina Gomes', '14', 'KG', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Mariana Moura
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Mariana Moura', '15', 'MM', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Nicolas Santos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Nicolas Santos', '16', 'NS', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Igor Fernandes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Igor Fernandes', '17', 'IF', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Nicole Oliveira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Nicole Oliveira', '18', 'NO', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Enzo Fernandes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Enzo Fernandes', '19', 'EF', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Elisa Barbosa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Elisa Barbosa', '20', 'EB', 'from-pink-400 to-rose-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Karina Souza
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Karina Souza', '21', 'KS', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Miguel Nascimento
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Miguel Nascimento', '22', 'MN', 'from-pink-400 to-rose-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Elisa Pereira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Elisa Pereira', '23', 'EP', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Nicolas Rocha
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Nicolas Rocha', '24', 'NR', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Guilherme Barros
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Guilherme Barros', '25', 'GB', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Ana Moura
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Ana Moura', '26', 'AM', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Miguel Cavalcanti
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Miguel Cavalcanti', '27', 'MC', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Rafael Ribeiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Rafael Ribeiro', '28', 'RR', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Elisa Gomes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Elisa Gomes', '29', 'EG', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Tiago Freitas
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Tiago Freitas', '30', 'TF', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sarah Barbosa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sarah Barbosa', '01', 'SB', 'from-red-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Clara Castro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Clara Castro', '02', 'CC', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sabrina Rocha
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sabrina Rocha', '03', 'SR', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Nicolas Costa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Nicolas Costa', '04', 'NC', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Kaique Almeida
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Kaique Almeida', '05', 'KA', 'from-red-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Quezia Lima
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Quezia Lima', '06', 'QL', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Olivia Lima
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Olivia Lima', '07', 'OL', 'from-pink-400 to-rose-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Natalia Dias
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Natalia Dias', '08', 'ND', 'from-purple-400 to-violet-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Olavo Araujo
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Olavo Araujo', '09', 'OA', 'from-purple-400 to-violet-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Vitoria Rocha
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Vitoria Rocha', '10', 'VR', 'from-purple-400 to-violet-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Sofia Dias
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Sofia Dias', '11', 'SD', 'from-pink-400 to-rose-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Tiago Araujo
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Tiago Araujo', '12', 'TA', 'from-green-400 to-emerald-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Laura Rodrigues
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Laura Rodrigues', '13', 'LR', 'from-red-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Elisa Nascimento
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Elisa Nascimento', '14', 'EN', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Bernardo Moura
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Bernardo Moura', '15', 'BM', 'from-purple-400 to-violet-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Natalia Oliveira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Natalia Oliveira', '16', 'NO', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Clara Oliveira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Clara Oliveira', '17', 'CO', 'from-pink-400 to-rose-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Bernardo Pereira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Bernardo Pereira', '18', 'BP', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Yuri Ribeiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Yuri Ribeiro', '19', 'YR', 'from-red-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Valentina Santos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Valentina Santos', '20', 'VS', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Mateus Monteiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Mateus Monteiro', '21', 'MM', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Vitoria Carvalho
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Vitoria Carvalho', '22', 'VC', 'from-pink-400 to-rose-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Daniela Araujo
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Daniela Araujo', '23', 'DA', 'from-pink-400 to-rose-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Joao Costa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Joao Costa', '24', 'JC', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Ana Barros
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Ana Barros', '25', 'AB', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Joao Fernandes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Joao Fernandes', '26', 'JF', 'from-green-400 to-emerald-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Caio Santos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Caio Santos', '27', 'CS', 'from-purple-400 to-violet-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Vanessa Mendes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Vanessa Mendes', '28', 'VM', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Pedro Lima
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Pedro Lima', '29', 'PL', 'from-green-400 to-emerald-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Joao Mendes
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Joao Mendes', '30', 'JM', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'B', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
END $$;