// MVC Configuration and Helper Functions

class MVCConfig {
  constructor() {
    this.modelsPath = '../models';
    this.viewsPath = '../views';
    this.controllersPath = '../controllers';
    this.routesPath = '../routes';
    this.servicesPath = '../services';
    this.middlewarePath = '../middleware';
    this.utilsPath = '../utils';
  }

  // Auto-load all models
  loadModels() {
    const fs = require('fs');
    const path = require('path');
    
    const models = {};
    const modelFiles = fs.readdirSync(this.modelsPath).filter(file => file.endsWith('.js') && file !== 'index.js');
    
    for (const file of modelFiles) {
      const modelName = path.basename(file, '.js');
      try {
        models[modelName] = require(path.join(this.modelsPath, file)).default;
        console.log(`✅ Loaded model: ${modelName}`);
      } catch (error) {
        console.error(`❌ Error loading model ${modelName}:`, error.message);
      }
    }
    
    return models;
  }

  // Auto-load all controllers
  loadControllers() {
    const fs = require('fs');
    const path = require('path');
    
    const controllers = {};
    const controllerFiles = fs.readdirSync(this.controllersPath).filter(file => file.endsWith('.js'));
    
    for (const file of controllerFiles) {
      const controllerName = path.basename(file, '.js');
      try {
        controllers[controllerName] = require(path.join(this.controllersPath, file));
        console.log(`✅ Loaded controller: ${controllerName}`);
      } catch (error) {
        console.error(`❌ Error loading controller ${controllerName}:`, error.message);
      }
    }
    
    return controllers;
  }

  // Auto-load all routes
  loadRoutes() {
    const fs = require('fs');
    const path = require('path');
    
    const routes = {};
    const routeFiles = fs.readdirSync(this.routesPath).filter(file => file.endsWith('.js'));
    
    for (const file of routeFiles) {
      const routeName = path.basename(file, '.js');
      try {
        routes[routeName] = require(path.join(this.routesPath, file)).default;
        console.log(`✅ Loaded route: ${routeName}`);
      } catch (error) {
        console.error(`❌ Error loading route ${routeName}:`, error.message);
      }
    }
    
    return routes;
  }

  // Get MVC structure information
  getStructure() {
    return {
      models: this.loadModels(),
      controllers: this.loadControllers(),
      routes: this.loadRoutes(),
      paths: {
        models: this.modelsPath,
        views: this.viewsPath,
        controllers: this.controllersPath,
        routes: this.routesPath,
        services: this.servicesPath,
        middleware: this.middlewarePath,
        utils: this.utilsPath
      }
    };
  }

  // Validate MVC structure
  validateStructure() {
    const fs = require('fs');
    const path = require('path');
    
    const requiredPaths = [
      this.modelsPath,
      this.viewsPath,
      this.controllersPath,
      this.routesPath,
      this.servicesPath,
      this.middlewarePath,
      this.utilsPath
    ];

    const results = {
      valid: true,
      errors: [],
      warnings: []
    };

    for (const dirPath of requiredPaths) {
      if (!fs.existsSync(dirPath)) {
        results.errors.push(`Missing directory: ${dirPath}`);
        results.valid = false;
      }
    }

    // Check for index.js in models directory
    const modelsIndexPath = path.join(this.modelsPath, 'index.js');
    if (!fs.existsSync(modelsIndexPath)) {
      results.warnings.push('Missing models/index.js file for model exports');
    }

    return results;
  }

  // Generate MVC documentation
  generateDocumentation() {
    const structure = this.getStructure();
    
    let doc = '# MVC Structure Documentation\n\n';
    
    doc += '## 📁 Directory Structure\n\n';
    doc += '```\n';
    doc += 'src/\n';
    doc += '├── models/          # Data models and business logic\n';
    doc += '├── views/           # Templates and view logic\n';
    doc += '├── controllers/     # Request handlers\n';
    doc += '├── routes/          # Route definitions\n';
    doc += '├── services/        # Business services\n';
    doc += '├── middleware/      # Express middleware\n';
    doc += '├── utils/           # Utility functions\n';
    doc += '└── config/          # Configuration files\n';
    doc += '```\n\n';

    doc += '## 📊 Loaded Components\n\n';
    
    doc += '### Models\n';
    for (const [name] of Object.entries(structure.models)) {
      doc += `- ✅ ${name}\n`;
    }
    
    doc += '\n### Controllers\n';
    for (const [name] of Object.entries(structure.controllers)) {
      doc += `- ✅ ${name}\n`;
    }
    
    doc += '\n### Routes\n';
    for (const [name] of Object.entries(structure.routes)) {
      doc += `- ✅ ${name}\n`;
    }

    doc += '\n## 🔄 MVC Flow\n\n';
    doc += '1. **Request** → Routes → Controllers\n';
    doc += '2. **Controller** → Services → Models\n';
    doc += '3. **Models** → Database Operations\n';
    doc += '4. **Response** → Views (if needed) → Client\n\n';

    doc += '## 📝 Best Practices\n\n';
    doc += '- **Models**: Handle data validation and business logic\n';
    doc += '- **Controllers**: Handle HTTP requests and responses\n';
    doc += '- **Routes**: Define API endpoints only\n';
    doc += '- **Services**: Complex business logic and external integrations\n';
    doc += '- **Middleware**: Cross-cutting concerns (auth, validation)\n';
    doc += '- **Views**: Template rendering and UI logic\n';

    return doc;
  }
}

export default MVCConfig;
