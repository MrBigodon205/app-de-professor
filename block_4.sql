DO $$
DECLARE
  v_class_id BIGINT;
  v_student_id BIGINT;
BEGIN
  -- Class: 1º Ano E.M.
  INSERT INTO classes (name, sections, user_id) VALUES ('1º Ano E.M.', '{"A"}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_class_id;
  -- Student: Laura Ribeiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Laura Ribeiro', '01', 'LR', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Otavio Almeida
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Otavio Almeida', '02', 'OA', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Vanessa Monteiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Vanessa Monteiro', '03', 'VM', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Paula Pinto
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Paula Pinto', '04', 'PP', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Mariana Alves
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Mariana Alves', '05', 'MA', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Nicolas Barbosa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Nicolas Barbosa', '06', 'NB', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Gabriela Souza
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Gabriela Souza', '07', 'GS', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Eduardo Pinto
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Eduardo Pinto', '08', 'EP', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Nicolas Castro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Nicolas Castro', '09', 'NC', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Karina Silva
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Karina Silva', '10', 'KS', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Joao Martins
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Joao Martins', '11', 'JM', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Nicole Costa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Nicole Costa', '12', 'NC', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Miguel Lima
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Miguel Lima', '13', 'ML', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Yuri Campos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Yuri Campos', '14', 'YC', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Olivia Pereira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Olivia Pereira', '15', 'OP', 'from-blue-400 to-indigo-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Olivia Santos
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Olivia Santos', '16', 'OS', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Nicolas Rocha
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Nicolas Rocha', '17', 'NR', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Bruno Oliveira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Bruno Oliveira', '18', 'BO', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Quezia Pinto
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Quezia Pinto', '19', 'QP', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Karina Ribeiro
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Karina Ribeiro', '20', 'KR', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Arthur Pereira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Arthur Pereira', '21', 'AP', 'from-yellow-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Yuri Rodrigues
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Yuri Rodrigues', '22', 'YR', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Clara Rodrigues
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Clara Rodrigues', '23', 'CR', 'from-red-400 to-orange-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Felipe Almeida
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Felipe Almeida', '24', 'FA', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Helena Barros
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Helena Barros', '25', 'HB', 'from-cyan-400 to-teal-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Daniela Martins
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Daniela Martins', '26', 'DM', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Eduardo Cardoso
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Eduardo Cardoso', '27', 'EC', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Laura Barbosa
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Laura Barbosa', '28', 'LB', 'from-purple-400 to-violet-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Vitoria Pereira
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Vitoria Pereira', '29', 'VP', 'from-indigo-400 to-purple-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
  -- Student: Vitoria Silva
  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) 
  VALUES ('Vitoria Silva', '30', 'VS', 'from-green-400 to-emerald-500', NULL, v_class_id, 'A', '{}', 'bd2081e8-880b-45bd-ba38-4e4ab18d6858') RETURNING id INTO v_student_id;
END $$;