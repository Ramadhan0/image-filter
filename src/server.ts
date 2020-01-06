import express from 'express';
import bodyParser from 'body-parser';
import { filterImageFromURL, deleteLocalFiles, encryptPassword, comparePassword, generateToken, authenticate } from './util/util';

const User: [{ username: string, email: string, password: string }] = [
  { username: 'test-username', email: 'email.test@email.com', password: 'test1234' }
];


(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;

  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

  /**************************************************************************** */

  //! END @TODO1

  app.get("/filterimage", authenticate, async (req: express.Request, res: express.Response) => {
    try {
      const { image_url } = req.query;
      if (!image_url) return res.status(400).send('Image url is required');
      const filteredpath = await filterImageFromURL(image_url);
      return res.status(200).json({
        status: 200,
        image_path: filteredpath
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        error
      });
    }
  });

  // delete image
  app.delete("/filterimage", authenticate, async (req: express.Request, res: express.Response) => {
    try {
      const { image_path } = req.query;
      if (!image_path) return res.status(400).send('Image path is required');
      await deleteLocalFiles([image_path]);
      return res.status(200).json({
        status: 200,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        error
      });
    }
  });

  // signup
  app.post('/register', async (req: express.Request, res: express.Response) => {

    try {
      const { username, email, password } = req.body

      // check if email and password are provided
      if (!email || !password) return res.status(400).json({
        status: 400,
        message: 'email and password are required'
      });

      let user;

      // check if email is already registered
      user = await User.find(user => user.email === email)
      if (user) return res.status(400).json({
        status: 400,
        message: 'email already registered, please use another email or login'
      });

      const encryptedPassword = await encryptPassword(password)

      user = await User.push({ username, email, password: encryptedPassword });
      const createdUser: { username: string, email: string } = await User.find(user => user.email === email);
      user = {
        username: createdUser.username,
        email: createdUser.email
      }

      const token = await generateToken(user);

      return res.status(201).json({
        status: 201,
        user,
        token
      });

    } catch (error) {
      return res.status(500).json({
        status: 500,
        error
      });
    }

  });

  // login
  app.post('/login', async (req: express.Request, res: express.Response) => {

    try {
      const { email, password } = req.body

      // check if email and password are provided
      if (!email || !password) return res.status(400).json({
        status: 400,
        message: 'email and password are required'
      });

      // login
      const user = await User.find(user => user.email === email)

      if (!user || user.email !== email) return res.status(400).json({
        status: 400,
        message: 'invalid email or password'
      });

      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) return res.status(400).json({
        status: 400,
        message: 'invalid email or password'
      });

      const token = await generateToken({ username: user.username, email: user.email });

      return res.status(200).json({
        status: 200,
        user: { username: user.username, email: user.email },
        token
      });

    } catch (error) {
      return res.status(500).json({
        status: 500,
        error
      });
    }

  });

  // Root Endpoint
  // Displays a simple message to the user
  app.get("/", async (req: express.Request, res: express.Response) => {
    res.send("try GET /filteredimage?image_url={{}}")
  });


  // Start the Server
  app.listen(port, () => {
    console.log(`server running http://localhost:${port}`);
    console.log(`press CTRL+C to stop server`);
  });
})();
