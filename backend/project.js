/*!
 * Copyright 2015 mifort.org
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var dbSettings = require('./libs/mongodb_settings');
var utils = require('./libs/utils');
var companies = require('./company');
var users = require('./user');

//Rest API
exports.restGetById = function(req, res) {
    var projectId = utils.getProjectId(req);
    var projects = dbSettings.projectCollection();
    projects.findOne({_id: projectId}, 
        function(err, doc) {
            returnProjectCallback(err, res, doc);
        }
    );
};

exports.restSave = function(req, res) {
    var project = req.body;
    
    if(project._id) { //update
        updateProject(project, res);
    } else { //create
        createProject(project, res);
    }
};

exports.restGetByCompanyId = function(req, res) {
    var companyId = utils.getCompanyId(req);
    var projects = dbSettings.projectCollection();
    projects.find({companyId: companyId,
                   active: true})
        .toArray(function(err, findedProjects){
            if(err) {
                res.status(404).json({error: 'Cannot find projects!'});
            } else {
                res.json(findedProjects);
            }
        });
};

exports.restDeactivateProject = function(req, res) {
    var projectId = utils.getProjectId(req);
    var projects = dbSettings.projectCollection();
    projects.update({ _id: projectId},
                    {$set: { active: false } },
        function(err, savedProject) {
            returnProjectCallback(err, res, savedProject);
        });
};

//Public API
exports.saveInDb = function(project, callback) {
    var projects = dbSettings.projectCollection();
    projects.save(project, {safe:true}, function (err, result) {
        if(result.ops) {
            callback(err, result.ops[0]);
        } else {
            callback(err, project);
        }
    });
};

exports.generateDefaultProject = function(company) {
    return {
        name: company.name,
        template: company.template,
        periods: company.periods,
        companyId: company._id,
        active: true
    };
};

//Private
function returnProjectCallback(err, res, savedProject) {
    if(err) {
        res.status(500).json(err);
        return;
    }
    res.json(savedProject);
}

function updateProject(project, res) {
    var projects = dbSettings.projectCollection();
    projects.find({_id: project._id,
                   name: {$ne: project.name}},
                  {limit: 1})
        .count(function(err, count) {
            if(count > 0) {
                projects.update({ _id: project._id },
                                {$set: {
                                    name: project.name
                                },
                                $currentDate: { updatedOn: true }},
                    function(err, savedProject) { //need error handler
                        projects.findOne({_id: project._id}, 
                            function(err, doc) {
                                returnProjectCallback(err, res, doc);
                            }
                        );
                        users.updateAssignmentProjectName(project);
                    });
            }
        });
}

function createProject(project, res){
    var projects = dbSettings.projectCollection();
    companies.findById(project.companyId, function(err, company) {
        if(err) {
            res.status(500).json(err);
            return;
        }
        project.defaultValues = company.defaultValues;
        project.template = company.template;
        project.periods = company.periods;
        var currentDate = new Date();
        project.createdOn = currentDate;
        project.updatedOn = currentDate;
        project.active = true;
        projects.insertOne(project, {safe: true}, 
            function(err, result) {
                res.json(result.ops[0]);
            });
    });
}