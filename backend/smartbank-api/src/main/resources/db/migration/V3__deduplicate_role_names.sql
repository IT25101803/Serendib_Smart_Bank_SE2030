-- Consolidate duplicate role names before enforcing case-insensitive uniqueness.
CREATE TEMPORARY TABLE role_name_merge (
    role_id INT NOT NULL PRIMARY KEY,
    canonical_role_id INT NOT NULL
) ENGINE=InnoDB;

INSERT INTO role_name_merge(role_id, canonical_role_id)
SELECT role.role_id,
       (SELECT MIN(candidate.role_id)
        FROM role candidate
        WHERE LOWER(candidate.role_name) COLLATE utf8mb4_unicode_ci
            = LOWER(role.role_name) COLLATE utf8mb4_unicode_ci)
FROM role;

UPDATE users
JOIN role_name_merge ON users.role_id = role_name_merge.role_id
SET users.role_id = role_name_merge.canonical_role_id
WHERE role_name_merge.role_id <> role_name_merge.canonical_role_id;

DELETE role
FROM role
JOIN role_name_merge ON role.role_id = role_name_merge.role_id
WHERE role_name_merge.role_id <> role_name_merge.canonical_role_id;

DROP TEMPORARY TABLE role_name_merge;

UPDATE role
SET role_name = CASE LOWER(role_name)
    WHEN 'admin' THEN 'Admin'
    WHEN 'customer' THEN 'Customer'
    WHEN 'manager' THEN 'Manager'
    WHEN 'employee' THEN 'Employee'
    ELSE role_name
END
WHERE LOWER(role_name) IN ('admin', 'customer', 'manager', 'employee');

ALTER TABLE role
    MODIFY role_name VARCHAR(50)
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;