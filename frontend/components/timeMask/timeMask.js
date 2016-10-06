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

'use strict';

angular.module('mifortTimesheet')
    .directive('timeMask', function () {
        return {
            scope: true,
            link: function (scope, element, attrs) {
                var input = element.find('input');

                input.on('blur', function(){
                    var time = $(this).val();

                    if(time != ''){
                        $(this).val(time + 'h');
                    }
                });

                input.on('focus', function(){
                    var time = $(this).val();

                    if(time != '' && time.slice(-1) == 'h'){
                        $(this).val(time.slice(0, -1));
                    }
                });

                input.on('keypress', function(event){
                    if(event.which != 8 && isNaN(String.fromCharCode(event.which))){
                        event.preventDefault(); //stop character from entering input
                    }
                });

                scope.$watch(attrs.watch, function(newValue, oldValue) {
                    //if(scope.project){
                        var time = input.val();

                        if(time && time.slice(-1) !== 'h'){
                            input.val(time + 'h')
                        }
                    //}
                });
            },
            templateUrl: function (element) {
                var activeTemplate;

                if(element.hasClass('timesheet-hours')){
                    activeTemplate = 'components/timeMask/timeMask.html';
                }
                else{
                    activeTemplate = 'components/timeMask/workloadMask.html';
                }

                return activeTemplate
            }
        };
    });