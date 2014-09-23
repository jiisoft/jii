/**
 * @author <a href="http://www.affka.ru">Vladimir Kozhin</a>
 * @license MIT
 */

/**
 * @class Jii.validator.Validator
 * @extends Jii.base.Object
 */
Jii.defineClass('Jii.validator.Validator', {

	__extends: Jii.base.Object,

	__static: {

		defaultValidators: {

			'boolean': 'Jii.validator.BooleanValidator',
			'compare': 'Jii.validator.CompareValidator',
			'date': 'Jii.validator.DateValidator',
			'default': 'Jii.validator.DefaultValueValidator',
			'double': 'Jii.validator.NumberValidator',
			'email': 'Jii.validator.EmailValidator',
			//'exist': 'Jii.validator.ExistValidator',
			//'file': 'Jii.validator.FileValidator',
			'filter': 'Jii.validator.FilterValidator',
			//'image': 'Jii.validator.ImageValidator',
			'in': 'Jii.validator.RangeValidator',
			'integer': {
				'className': 'Jii.validator.NumberValidator',
				'integerOnly': true
			},
			'match': 'Jii.validator.RegularExpressionValidator',
			'number': 'Jii.validator.NumberValidator',
			'required': 'Jii.validator.RequiredValidator',
			'safe': 'Jii.validator.SafeValidator',
			'string': 'Jii.validator.StringValidator',
			//'unique': 'Jii.validator.UniqueValidator',
			'url': 'Jii.validator.UrlValidator'
		},

		create: function (type, object, attributes, params) {
			params = params || {};
			params.attributes = attributes;

			if (_.isFunction(object[type])) {
				params.className = 'Jii.validator.InlineValidator';
				params.method = type;
			} else {
				if (_.has(this.defaultValidators, type)) {
					type = this.defaultValidators[type];
				}

				if (_.isArray(type)) {
					_.extend(params, type);
				} else {
					params.className = type;
				}
			}

			return Jii.createObject(params);
		}

	},

    attributes: [],
    message: null,
    on: [],
    except: [],
    skipOnError: true,
    skipOnEmpty: true,
    deferred: null,

    init: function() {

    },

    /**
     * @abstract
     * @param object
     * @param attribute
	 * @returns {Promise|null}
     */
    validateAttribute: function (object, attribute) {
    },

    validateValue: function() {
        throw new Jii.exceptions.ApplicationException('Not found implementation for method `validateValue()`.');
    },

    validate: function(object, attributes) {
        attributes = _.isArray(attributes) ?
            _.intersection(this.attributes, attributes) :
            this.attributes;

        var promises = _.map(attributes, _.bind(function(attribute) {
            if (this.skipOnError && object.hasErrors(attribute)) {
                return;
            }

            if (this.skipOnEmpty && this.isEmpty(object.get(attribute))) {
                return;
            }

            return this.validateAttribute(object, attribute);
        }, this));

        return Promise.all(promises);
    },

    isActive: function(scenario) {
        return _.indexOf(this.except, scenario) === -1 &&
            (this.on.length === 0 || _.indexOf(this.on, scenario) !== -1);
    },

    addError: function(object, attribute, message, params) {
        params = params || {};
        params.attribute = object.getAttributeLabel(attribute);
        params.value = object.get(attribute);

        // @todo
        //message = Jii.t('jii', message);
        _.each(params, function(value, key) {
            message = message.replace('{' + key + '}', value);
        });

        object.addError(attribute, message);
        //Jii.app.logger.error('Validation error in model `%s`:', object.debugClassName, message);
    },

    isEmpty: function(value, isTrim) {
        return value === null ||
            value === '' ||
            (isTrim && _.isString(value) && value.replace(/^\s+|\s+$/g, '') === '') ||
            (_.isArray(value) && value.length === 0);
    }


});
