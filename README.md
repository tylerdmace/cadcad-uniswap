# Labs cadCAD Template
Creating a new cadCAD project that is Labs-ready is very simple using the cadCAD CLI `labs` template.

## Install the cadCAD CLI
You can find the CLI [here](https://github.com/cadcad-org/cadcad-cli). Follow the included installation instructions for your specific operating system.

## Scaffold a new project
First, create a new directory for your model:
```bash
mkdir my-model
```

Next, from inside that new directory, invoke the cadCAD CLI by specifying the Labs template:
```bash
cadcad-cli --template=https://github.com/blockscience-labs/cadcad-template-labs
```

Optionally, you can install the `labs` template for future use (negating the need to specify the URL with each scaffold):
```bash
cadcad-cli --install-template=https://github.com/blockscience-labs/cadcad-template-labs --name=labs
```

And scaffold with:
```bash
cadcad-cli --template=labs
```

## The Labs-ready cadCAD Model
The Labs model you scaffold from our template will be built against cadCAD 0.4.28 and will include the following:
- `example-data.csv`: a CSV file containing pre-generated data that you can experiment with right away
- `example-labs.ipynb`: a Jupyter Notebook containing example code demonstrating the use of the [Labs SDK](https://github.com/blockscience-labs/labs-sdk) for fetching simulation results directly from the Labs platform and an example demonstrating how to use the SDK to import simulation results from an exported CSV file
- `example-local.ipynb`: a Jupyter Notebook containing example code demonstrating the offline execution of the model directly from within the notebook itself
- `model`: a directory containing a very simple [Robots and Marbles](https://github.com/cadCAD-org/demos/tree/master/tutorials/robots_and_marbles) model configured for 3 monte-carlo runs and a `model_id` of `default`
- `labs.py`: a Labs-required file that makes your `Experiment` object available and defines the parent directory containing all your model logic
- `requirements.txt`: the Python dependencies required for your model to run -- these are installed automatically by the Labs platform if present
- `post-requirements.txt`: the Python dependencies required for post-processing and analytics pipelines -- these are installed automatically by the Labs platform when you start a JupyerLab instance if present
- `docs`: a directory containing the mkdocs docsite for the project
- `mkdocs.yml`: a configuration for mkdocs that dictates how to build the projects docsite
