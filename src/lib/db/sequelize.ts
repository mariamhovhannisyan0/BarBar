import { Sequelize } from "sequelize";
import path from "path";

declare global {
  // eslint-disable-next-line no-var
  var _sequelizeInstance: Sequelize | undefined;
}

export const getSequelize = (): Sequelize => {
  if (global._sequelizeInstance) {
    return global._sequelizeInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  let instance: Sequelize;

  if (databaseUrl && databaseUrl.startsWith("postgres")) {
    instance = new Sequelize(databaseUrl, {
      dialect: "postgres",
      logging: process.env.NODE_ENV === "development" ? false : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions:
        process.env.DB_SSL === "true"
          ? {
              ssl: {
                require: true,
                rejectUnauthorized: false,
              },
            }
          : {},
    });
  } else {
    // Zero-config SQLite storage for local developer runs
    const storagePath = process.env.SQLITE_PATH || path.join(process.cwd(), "barbar.sqlite");
    instance = new Sequelize({
      dialect: "sqlite",
      storage: storagePath,
      logging: false,
    });
  }

  global._sequelizeInstance = instance;
  return instance;
};

export const sequelize = getSequelize();

