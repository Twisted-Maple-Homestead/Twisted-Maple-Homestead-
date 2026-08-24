-- Starter crop reference data for Homestead Helper
insert into crop_reference
(id, common_name, category, plant_family, season, days_to_maturity_min, days_to_maturity_max, spacing_in, row_spacing_in, min_container_gal, yield_min_lb, yield_max_lb, succession_interval_days)
values
('VEG001','Tomato','Vegetable','Solanaceae','Warm',60,90,18,36,5,8,20,21),
('VEG004','Bush Bean','Vegetable','Fabaceae','Warm',50,65,4,18,2,.25,.6,14),
('VEG015','Carrot','Vegetable','Apiaceae','Cool/Warm',60,85,2,12,3,.15,.3,14),
('VEG023','Lettuce','Vegetable','Asteraceae','Cool',30,60,8,12,2,.3,.8,10),
('VEG007','Cucumber','Vegetable','Cucurbitaceae','Warm',50,70,12,36,5,5,12,21),
('VEG002','Bell Pepper','Vegetable','Solanaceae','Warm',60,85,18,30,3,2,5,21),
('VEG008','Zucchini','Vegetable','Cucurbitaceae','Warm',45,60,24,48,10,6,15,21),
('VEG021','Onion','Vegetable','Amaryllidaceae','Cool/Warm',90,120,4,12,3,.25,.6,0),
('VEG013','White Potato','Vegetable','Solanaceae','Cool/Warm',70,110,12,30,10,1.5,4,0),
('VEG025','Kale','Vegetable','Brassicaceae','Cool',50,70,12,18,5,1,3,21)
on conflict (id) do update set common_name=excluded.common_name;

insert into crop_timing_rules
(crop_id, indoor_start_offset_days, direct_sow_offset_days, transplant_offset_days, fall_planting_lead_days, min_soil_temp_f, frost_tolerance)
values
('VEG001',-56,null,14,null,60,'Tender'),
('VEG004',null,7,null,70,60,'Tender'),
('VEG015',null,-28,null,80,40,'Hardy'),
('VEG023',-42,-35,-21,45,40,'Hardy'),
('VEG007',-21,7,14,75,60,'Tender'),
('VEG002',-70,null,14,null,65,'Tender'),
('VEG008',-21,7,14,65,60,'Tender'),
('VEG021',-70,-28,-21,110,35,'Hardy'),
('VEG013',null,-28,null,100,45,'Moderate'),
('VEG025',-42,-28,-21,75,40,'Very hardy')
on conflict (crop_id) do update set
indoor_start_offset_days=excluded.indoor_start_offset_days,
direct_sow_offset_days=excluded.direct_sow_offset_days,
transplant_offset_days=excluded.transplant_offset_days,
fall_planting_lead_days=excluded.fall_planting_lead_days,
min_soil_temp_f=excluded.min_soil_temp_f,
frost_tolerance=excluded.frost_tolerance;
