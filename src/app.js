
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import passport from 'passport';
import {authRouter} from './routes/auth';
import logger from 'morgan';
import { ExpressDataApplication, serviceRouter, dateReviver } from '@themost/express';
import indexRouter from './routes/index';
import { DataConfigurationStrategy } from '@themost/data';
import {ViewEngine} from '@themost/ejs';
import '@themost/json/register';
import { Authenticator } from './services/Authenticator';
import debug from 'debug';
const error = debug('app:error');
/**
 * @name Request#context
 * @description Gets an instance of ExpressDataContext class which is going to be used for data operations
 * @type {ExpressDataContext}
 */
/**
 * @name express.Request#context
 * @description Gets an instance of ExpressDataContext class which is going to be used for data operations
 * @type {ExpressDataContext}
 */

function getApplication() {
  /**
   * Initialize express application
   * @type {Express}
   */
  let app = express();

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.engine('ejs', ViewEngine.express());
  app.set('view engine', 'ejs');

  app.use(logger('dev'));

  app.use(express.json({
    reviver: dateReviver
  }));
  app.use(express.urlencoded({ extended: false }));

  // @themost/data data application setup
  const dataApplication = new ExpressDataApplication(path.resolve(__dirname, 'config'));

  // reload configuration
  dataApplication.getConfiguration().useStrategy(DataConfigurationStrategy, DataConfigurationStrategy);

  // use default authenticator
  if (dataApplication.hasService(Authenticator) === false) {
    dataApplication.useService(Authenticator);
  }
          
  // hold data application
  app.set('ExpressDataApplication', dataApplication);
  // use cookie parser
  const secret = dataApplication.getConfiguration().getSourceAt('settings/crypto/key');
  // use cookie parser
  app.use(cookieParser(secret));

  // use session
  app.use(cookieSession({
    name: 'session',
    keys: [secret]
  }));
  // use data middleware (register req.context)
  app.use(dataApplication.middleware());
  // use passport
  app.use(authRouter(passport));
  // use static content
  app.use(express.static(path.join(process.cwd(), 'assets')));

  app.use('/', indexRouter);
  // use @themost/express service router
  app.use('/api', serviceRouter);

  // error handler
  app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    error(err);
    const status = err.status || err.statusCode || 500;
    // render the error page
    res.status(status);
    res.render('error');
  });
  
  return app;
}

export {
  getApplication
}
