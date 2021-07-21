import { default as express } from "express";
import { NextFunction, Request, Response } from "express";

import * as Fake from "./fake";
import * as PlayUrl from "./play-url";

const getServer = (port: number) => {
  const app = express();

  app.use(Fake.Route, Fake.getProxy());
  app.use(PlayUrl.Route, PlayUrl.getHandler(port));
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send(err.message);
  });

  return app.listen(port);
};

export default getServer;
